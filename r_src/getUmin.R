#' title
#' description
#' @file getUmin.R
#' @author Mariko Ohtsuka
#' @date 2024.7.8
rm(list=ls())
# ------ libraries ------
library(here)
source(here("r_src", "scraping_common.R"), encoding="utf-8")
library(httr)
# ------ constants ------
kUminSearchText <- "UMIN試験ID"
kNameTarget1 <- "日本語 名\n"
kNameTarget2 <- "\nミドルネーム\n\n姓\n"
kNameTarget3 <- "\n英語"
kUminRNoLabel <- "UMIN受付番号"
kNameOfPi <- "責任研究者/Name of lead principal investigator"
kUminIdLabel <- kIdLabel
kRecptNo <- "R[0-9]{9}"
kInterventionsPattern <- "介入([2-9]|10)/Interventions/Control_([2-9]|10)"
# ------ functions ------
GetTargetTagText <- function(elem, targetTag) {
  if (length(elem) == 0) {
    return("")
  }
  tags <- elem %>% html_nodes(xpath = targetTag)
  if (length(tags) == 0) {
    return("")
  }
  tags_text <- tags %>% map( ~ html_text(.))
  return(tags_text)
}
EditJpItemName <- function(target){
  for (i in 1:length(target)){
    if (str_detect(target[[i]][1], "^日本語")) {
      res <- target[[i]][1] %>% str_remove("^日本語") %>% trimws()
      return(res)
    }
  }
}
GetUminInfo <- function(uminRNo) {
  url <- str_c(kUminRecptNUrlHead, uminRNo)
  webpage <- GetWebPageData(url)
  basetable <- webpage %>% html_nodes(xpath = '/html/body/div/table[1]/tbody/tr') %>% html_text()
  uminId <- NULL
  for (i in 1:length(basetable)) {
    if (str_detect(basetable[i], kUminSearchText)) {
      uminId <- basetable[i] %>% str_remove(kUminSearchText) %>% str_remove_all("\n")
      break
    }
  }
  parent_node <- webpage %>% html_nodes(xpath = '/html/body')
  # Input_vew_Mandatory要素を全て取得
  mandatory_elements <- parent_node %>% html_nodes(xpath = '//*[@id="Input_vew_Mandatory"]')
  # Input_vew_any要素を全て取得
  any_elements <- parent_node %>% html_nodes(xpath = '//*[@id="Input_vew_any"]')
  div_nodes <- c(mandatory_elements, any_elements)
  headerAndBodies <- div_nodes %>% map( ~ {
    target <- .
    h3_nodes <- target %>% html_node("h3")
    h3Text <- ifelse(length(h3_nodes) > 0, html_text(html_node(target, "h3")), "")
    tr_nodes <- target %>% html_node("tr")
    p_tags_text <- tr_nodes %>% GetTargetTagText("./p")
    all_empty <- p_tags_text %>% map_lgl(~ . == "") %>% all()
    if (all_empty) {
      table_nodes <- tr_nodes %>% html_nodes(xpath = "./table")
      if (length(table_nodes) > 0) {
        tr_tags <- table_nodes %>% html_nodes(xpath = "./tr")
        if (length(tr_tags) > 0) {
          p_tags_text <- tr_tags %>% GetTargetTagText("./td")
        }
      }
    }
    if (length(p_tags_text) == 0) {
      p_tags_text <- target %>% GetTargetTagText("./p")
    }
    return(list(header=h3Text, bodies=p_tags_text))
  })
  # 責任医師名を再取得する
  for (i in 1:length(headerAndBodies)) {
    if (headerAndBodies[[i]]["header"] == kNameOfPi) {
      break
    }
  }
  target <- div_nodes[[i]]
  temp <- html_node(target, "tr") %>% html_node("table")
  sei <- temp %>% html_node("tr:nth-child(3)") %>% html_node("td:nth-child(2)") %>% html_text()
  mei <- temp %>% html_node("tr:nth-child(1)") %>% html_node("td:nth-child(2)") %>% html_text()
  nameOfPi <- str_c(sei, "　", mei) %>% str_remove("　$")
  headerAndBodies[[i]]["bodies"] <- nameOfPi
  # 見出しの整理
  outputHeaderAndBodies <- headerAndBodies
  intervention <- "なし"
  for (i in 1:length(outputHeaderAndBodies)) {
    header <- outputHeaderAndBodies[[i]]["header"] %>% flatten_chr()
    bodies <- outputHeaderAndBodies[[i]]["bodies"] %>% flatten()
    # 介入の有無
    if (header == "介入の目的/Purpose of intervention") {
      intervention <- "あり"
    }
    if (length(bodies) == 6) {
      if (bodies[[2]] == "年" & bodies[[4]] == "月" & bodies[[6]] == "日") {
        outputHeaderAndBodies[[i]]["bodies"] <- outputHeaderAndBodies[[i]]["bodies"] %>% map_vec(~ str_c(., collapse = ""))
      }
    }
    if (header == "一般向け試験名/Public title") {
      publicTitleJp <- EditJpItemName(bodies)
    } else if (header == "試験の種類/Study type") {
      header <- "研究の種別"
    } else if (header == "所属組織/Organization") {
      organizationJp <- EditJpItemName(bodies)
    } else if (header == "登録日時/Registered date") {
      registeredDate <- outputHeaderAndBodies[[i]]["bodies"]
      header <- "初回公表日"
    } else if (header == "年齢（下限）/Age-lower limit") {
      header <- "年齢下限/AgeMinimum"
      outputHeaderAndBodies[[i]]["bodies"] <- outputHeaderAndBodies[[i]]["bodies"] %>% map_vec(~ str_c(., collapse = ""))
    } else if (header == "年齢（上限）/Age-upper limit") {
      header <- "年齢上限/AgeMaximum"
      outputHeaderAndBodies[[i]]["bodies"] <- outputHeaderAndBodies[[i]]["bodies"] %>% map_vec(~ str_c(., collapse = ""))
    } else if (header == "介入1/Interventions/Control_1") {
      interactionText <- EditJpItemName(bodies)
    } else if (str_detect(header, kInterventionsPattern)) {
      temp_interactionText <- EditJpItemName(bodies)
      if (temp_interactionText != "") {
        interactionText <- interactionText %>% str_c("\r",  temp_interactionText)
      }
    } else if (header == "試験のフェーズ/Developmental phase") {
      header <- "試験のフェーズ"
    } else if (header == "対象疾患名/Condition") {
      disease <- EditJpItemName(bodies)
    } else if (header == "目的1/Narrative objectives1") {
      narrativeObjectives1 <- EditJpItemName(bodies)
    } else if (header == kNameOfPi) {
      header <- "研究責任（代表）医師の氏名"
    } else {
      header <- header
    }
    outputHeaderAndBodies[[i]]["header"] <- header
  }
  outputRow <- length(outputHeaderAndBodies) + 1
  outputHeaderAndBodies[[outputRow]] <- list()
  outputHeaderAndBodies[[outputRow]]["header"] <- "介入の有無"
  outputHeaderAndBodies[[outputRow]]["bodies"] <- intervention
  outputRow <- outputRow + 1
  outputHeaderAndBodies[[outputRow]] <- list()
  outputHeaderAndBodies[[outputRow]]["header"] <- kUminIdLabel
  outputHeaderAndBodies[[outputRow]]["bodies"] <- uminId
  outputRow <- outputRow + 1
  outputHeaderAndBodies[[outputRow]] <- list()
  outputHeaderAndBodies[[outputRow]]["header"] <- kUminRNoLabel
  outputHeaderAndBodies[[outputRow]]["bodies"] <- uminRNo
  outputRow <- outputRow + 1
  outputHeaderAndBodies[[outputRow]] <- list()
  outputHeaderAndBodies[[outputRow]]["header"] <- "初回公開日"
  outputHeaderAndBodies[[outputRow]]["bodies"] <- registeredDate
  outputRow <- outputRow + 1
  outputHeaderAndBodies[[outputRow]] <- list()
  outputHeaderAndBodies[[outputRow]]["header"] <- "研究名称"
  outputHeaderAndBodies[[outputRow]]["bodies"] <- publicTitleJp
  outputRow <- outputRow + 1
  outputHeaderAndBodies[[outputRow]] <- list()
  outputHeaderAndBodies[[outputRow]]["header"] <- "研究責任（代表）医師の所属機関"
  outputHeaderAndBodies[[outputRow]]["bodies"] <- organizationJp
  outputRow <- outputRow + 1
  outputHeaderAndBodies[[outputRow]] <- list()
  outputHeaderAndBodies[[outputRow]]["header"] <- "介入の内容/Intervention(s)"
  outputHeaderAndBodies[[outputRow]]["bodies"] <- interactionText
  outputRow <- outputRow + 1
  outputHeaderAndBodies[[outputRow]] <- list()
  outputHeaderAndBodies[[outputRow]]["header"] <- "対象疾患名"
  outputHeaderAndBodies[[outputRow]]["bodies"] <- disease
  outputRow <- outputRow + 1
  outputHeaderAndBodies[[outputRow]] <- list()
  outputHeaderAndBodies[[outputRow]]["header"] <- "研究・治験の目的"
  outputHeaderAndBodies[[outputRow]]["bodies"] <- narrativeObjectives1
  return(outputHeaderAndBodies)
}
ExecGetUminInfo <- function(recptNoList){
  uminList <- list()
  for (i in 1:length(recptNoList)){
    uminRNo <- recptNoList[i]
    temp <- tryCatch(
      {
        GetUminInfo(uminRNo)
      },
      error = function(e) {
        NA  # エラーが発生した場合にNAを返す
      }
    )
    uminList[[i]] <- temp
  }
  names(uminList) <- recptNoList
  return(uminList)
}
# ------ main ------
targetUminNoList <- targetList$umin %>% setdiff(existJrctUminNoList$umin)
if (length(targetUminNoList) > 0) {
  uminAndRecptNoList <- execGetRecptNoFromHtml(targetUminNoList)
  recptNoList <- uminAndRecptNoList %>% map_vec( ~ .$recptNo) %>% str_extract(kRecptNo) %>% unique()
  uminData <- ExecGetUminInfo(recptNoList)
  df_uminList <- uminData %>% map_df( ~ {
    values <- .
    temp <- tibble()
    for (i in 1:length(values)) {
      header <- values[[i]][["header"]]
      bodies <- values[[i]][["bodies"]]
      row_count <- length(bodies)
      temp_bodies <- tibble(header = character(row_count),
                            bodies = character(row_count)
                            )
      for (j in 1:row_count){
        temp_bodies[j, "header"] <- header
        temp_bodies[j, "bodies"] <- bodies[[j]]
      }
      temp <- temp %>% bind_rows(temp_bodies)
    }
    uminId <- temp %>% filter(header == kIdLabel) %>% .[1, "bodies", drop=T]
    temp[ , 3] <- uminId
    colnames(temp) <- kOutputHeader
    return(temp)
  })
  AddOutputSheet(df_uminList)
} else {
  print("UMIN:0件")
}
