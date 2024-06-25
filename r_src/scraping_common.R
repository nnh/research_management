#' title
#' description
#' @file scraping_common.r
#' @author Mariko Ohtsuka
#' @date 2024.6.20
# ------ libraries ------
# ------ constants ------
kUrlHead <- "https://jrct.niph.go.jp/latest-detail/"
kUminUrlHead <- "https://center6.umin.ac.jp/cgi-open-bin/ctr/index.cgi?sort=03&function=04&ctrno="
kUminRecptNUrlHead <- "https://center6.umin.ac.jp/cgi-open-bin/ctr/ctr_view.cgi?recptno="
kPubmedSheetName <- "pubmed"
kInputSheetName <- "jRCTandUMINNumbers"
kOutputSheetName <- "ctr_output"
kJrctNoColNum <- 3
kIdLabel <- "臨床研究実施計画番号"
kOutputHeader <- c("Label", "Value", "jrctNo")
kUminNo <- "^UMIN[0-9]{9}"
kUminRNo <- "^R[0-9]{9}"
kJRCTNo <- "jRCT[0-9]{10}|jRCTs[0-9]{9}"
# ------ functions ------
GetWebPageData <- function(url){
  return(read_html(url))
}
GetSsSheetId <- function(){
  tryCatch(
    {
      res <- read.csv(here("r_src", "sheet_id.txt"), header=F) %>% .[1, 1, drop=T]
      if (length(res) != 1) {
        stop("error: sheet id")
      }
      return(res)
    },
      error = function(e) {
        return(NA)
      },
      warning = function(e) {
      return(NA)
    }
  )
}
AddSheet <- function(add_sheet_name) {
  sheets <- sheetid %>% sheet_names()
  if (!str_detect(sheets, str_c("^", add_sheet_name, "$")) %>% any()) {
    sheetid %>% sheet_add(sheet=add_sheet_name)
  }
}
WriteSheet <- function(target_sheet_name, df) {
  AddSheet(target_sheet_name)
  sheetid %>% range_clear(sheet=target_sheet_name, range=NULL)
  sheetid %>% write_sheet(df, ss=., sheet=target_sheet_name)
}
sheetid <- GetSsSheetId()
AddOutputSheet <- function(df) {
  if (nrow(df) == 0) {
    return()
  }
  sheetid %>% read_sheet(sheet=kOutputSheetName, range="C:C", col_names=T) %>% flatten_chr() %>% unique()
  output_sheet <- sheetid %>% read_sheet(sheet=kOutputSheetName, col_names=F)
  start_row <- nrow(output_sheet) + 1
  end_row <- nrow(df) + start_row
  if (start_row > 1) {
    sheetid %>% range_write(df, sheet=kOutputSheetName, range=str_c("A", start_row, ":C", end_row), col_names=F)
  } else {
    sheetid %>% range_write(df, sheet=kOutputSheetName, range=str_c("A", start_row, ":C", end_row), col_names=T)
  }
}
GetDataByRange <- function(sheet, range){
  temp <- tryCatch(
    {
      sheetid %>% read_sheet(sheet=sheet, range=range, col_names=T) %>% flatten_chr()
    },
    error = function(e) {
      NA  # エラーが発生した場合にNAを返す
    }
  )
  if (length(temp) == 0) {
    return(NULL)
  }
  res <- temp %>% na.omit() %>% unique()
  return(res)
}
GetTargetNoList <- function(input_vec, targetStr){
  res <- input_vec %>% str_extract_all(targetStr) %>% flatten_chr() %>% na.omit() %>% unique()
  return(res)
}
GetJrctUminNoListBySheet <- function(sheet, range) {
  jrctUmin <- GetDataByRange(sheet, range)
  if (is.null(jrctUmin)) {
    return()
  }
  uminNoList <- jrctUmin %>% GetTargetNoList(kUminNo)
  jRCTNoList <- jrctUmin %>% GetTargetNoList(kJRCTNo)
  if (length(uminNoList) == 0 & length(jRCTNoList) == 0 ) {
    return(NULL)
  }
  return(list(umin=uminNoList, jRCT=jRCTNoList))
}

execGetRecptNoFromHtml <- function(uminIdList) {
  recptNoList <- uminIdList %>% map( ~ getRecptNoFromHtml_(.))
  return(recptNoList)
}

getRecptNoFromHtml_ <- function(uminId) {
  url <- str_c(kUminUrlHead, uminId)
  response <- httr::GET(url)
  data <- content(response, "text", encoding = "UTF-8")

  # Parse HTML and extract <a> tags with recptno
  html <- read_html(data)
  anchorTags <- html %>% html_nodes("a") %>% html_attr("href")
  recptnoList <- unique(unlist(regmatches(anchorTags, gregexpr("R[0-9]{9}", anchorTags))))

  if (length(recptnoList) == 0) {
    return("")
  }

  return(list(uminId=uminId, recptNo=recptnoList[1]))
}

existJrctUminNoList <- GetJrctUminNoListBySheet(kOutputSheetName, "C:C")
pubmedJrctUminNoList <- GetJrctUminNoListBySheet(kPubmedSheetName, "G:G")
inputJrctUminNoList <- GetJrctUminNoListBySheet(kInputSheetName, "A:A")
targetList <- modifyList(inputJrctUminNoList, pubmedJrctUminNoList)
targetJrctNoList <- targetList$jRCT %>% setdiff(existJrctUminNoList$jRCT)

