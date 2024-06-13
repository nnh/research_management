#' title
#' description
#' @file scraping_common.r
#' @author Mariko Ohtsuka
#' @date 2024.6.12
# ------ libraries ------
# ------ constants ------
kUrlHead <- "https://jrct.niph.go.jp/latest-detail/"
kInputSheetName <- "抽出対象のjRCT番号"
kOutputSheetName <- "output"
kWkSheetName <- "temp"
kUminInputSheetName <- "抽出対象のUMINID"
kUminOutputSheetName <- "output_umin"
kJrctNoColNum <- 3
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
