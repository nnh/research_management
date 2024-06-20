#' title
#' description
#' @file scraping_common.r
#' @author Mariko Ohtsuka
#' @date 2024.6.20
# ------ libraries ------
# ------ constants ------
kUrlHead <- "https://jrct.niph.go.jp/latest-detail/"
kUminUrlHead <- "https://center6.umin.ac.jp/cgi-open-bin/ctr/ctr_view.cgi?recptno="
kInputSheetName <- "jRCTandUMINNumbers"
kOutputSheetName <- "ctr_output"
kJrctNoColNum <- 3
kIdLabel <- "臨床研究実施計画番号"
kOutputHeader <- c("Label", "Value", "jrctNo")
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
# ------ main ------
# 入出力先スプレッドシートIDを取得
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
