#' title
#' description
#' @file getUmin.R
#' @author Mariko Ohtsuka
#' @date 2024.6.25
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
# ------ functions ------
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
  parent_node <- webpage %>% html_nodes(xpath = '/html/body/div') %>% html_nodes("div")
  parent_node[[1]] <- NULL
  h3Text <- parent_node %>% html_node("h3") %>% html_text()
  trList <- parent_node %>% html_node("tr") %>% map( ~ {
    target <- .
    temp <- html_node(target, "p") %>% html_text() %>% str_remove("^日本語") %>% str_remove("^\\s+") %>% str_remove("\n$") %>% str_remove("\r$")
    if (is.na(temp)) {
      return("")
    }
    if (temp != "") {
      return(temp)
    }
    temp <- html_node(target, "table") %>% html_node("tr") %>% html_text() %>% str_remove_all("\n")
    return(temp)
  })
  # 責任医師名を再取得する
  for (i in 1:length(h3Text)) {
    if (h3Text[i] == kNameOfPi) {
      break
    }
  }
  target <- parent_node[[i]]
  temp <- html_node(target, "tr") %>% html_node("table")
  sei <- temp %>% html_node("tr:nth-child(3)") %>% html_node("td:nth-child(2)") %>% html_text()
  mei <- temp %>% html_node("tr:nth-child(1)") %>% html_node("td:nth-child(2)") %>% html_text()
  nameOfPi <- str_c(sei, "　", mei)
  trList[[i]] <- nameOfPi

  header <- h3Text %>% map_vec( ~ {
    value <- .
    if (is.na(value)) {
      res <- "dummy"
    } else if (value == "一般向け試験名/Public title") {
      res <- "研究名称"
    } else if (value == "試験の種類/Study type") {
      res <- "研究の種別"
    } else if (value == "所属組織/Organization") {
      res <- "研究責任（代表）医師の所属機関"
    } else if (value == "登録日時/Registered date") {
      res <- "初回公表日"
    } else if (value == "年齢（下限）/Age-lower limit") {
      res <- "年齢下限/AgeMinimum"
    } else if (value == "年齢（上限）/Age-upper limit") {
      res <- "年齢上限/AgeMaximum"
    } else if (value == "介入1/Interventions/Control_1") {
      res <- "介入の内容/Intervention(s)"
    } else if (value == "試験のフェーズ/Developmental phase") {
      res <- "試験のフェーズ"
    } else if (value == "対象疾患名/Condition") {
      res <- "対象疾患名"
    } else if (value == "目的1/Narrative objectives1") {
      res <- "研究・治験の目的"
    } else if (value == kNameOfPi) {
      res <- "研究責任（代表）医師の氏名"
    } else {
      res <- value
    }
    return(res)
  })
  trText <- trList %>% flatten_chr()
  names(trList) <- header
  # 介入
  trList$介入の有無 <- ifelse("介入の目的/Purpose of intervention" %in% h3Text, "あり", "なし")
  # umin id
  trList[[kUminIdLabel]] <- uminId
  trList[[kUminRNoLabel]] <- uminRNo
  # 初回公開日
  trList$初回公開日 <- trList$`登録日時/Registered date`
  return(trList)
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
    temp_col <- values %>% names()
    temp[1:length(temp_col) , 1] <- temp_col
    temp[ , 2] <- values %>% flatten_chr()
    temp[ , 3] <- values[[kUminIdLabel]]
    colnames(temp) <- kOutputHeader
    return(temp)
  }) %>% filter(Label != "dummy")
  AddOutputSheet(df_uminList)
}
