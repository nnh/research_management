#' title
#' description
#' @file getJrct.R
#' @author Mariko Ohtsuka
#' @date 2024.06.12
# ------ libraries ------
source(here("r_src", "scraping_common.R"), encoding="utf-8")
# ------ constants ------
# ------ functions ------
GetTables <- function(table){
  # 各行のTHタグのラベルとTDタグの内容を取得してデータフレームにする
  res <- table %>% html_nodes("tr") %>% map_df( ~ {
    th <- .x %>% html_node("th") %>% html_text(trim = TRUE)
    td <- .x %>% html_node("td") %>% html_text(trim = TRUE)
    data.frame(Label = th, Value = td, stringsAsFactors = FALSE)
  })
  return(res)
}
GetBaseData <- function(webpage){
  captions <-  webpage %>% html_node(xpath = '/html/body/div/div[2]/table/tbody') %>% GetTables()
  # XPathを使って特定のテーブル要素を抽出
  managerial_matter <- webpage %>% html_node(xpath = '//*[@id="area-toggle-00"]/table/tbody') %>% GetTables()
  temp <- webpage %>% html_node(xpath = '//*[@id="area-toggle-02-01"]/table/tbody') %>% GetTables()
  temp$Label <- temp$Label %>% str_remove_all("\\s")
  trialBody <- temp %>%
    filter(str_detect(Label, "試験等の目的") |
           str_detect(Label, "実施予定被験者数") |
           str_detect(Label, "実施期間")|
           str_detect(Label, "年齢")
          )
  res <- bind_rows(captions, managerial_matter, trialBody)
  jrctNo <- res %>% filter(str_detect(Label, "jRCT番号")) %>% .[ , "Value", drop=T]
  res$jrctNo <- jrctNo
  return(res)
}
GetJrctTables <- function(url) {
  webpage <- GetWebPageData(url)
  Sys.sleep(3)
  res <- GetBaseData(webpage)
  return(res)
}
GetTargetJrctNoList <- function(){
  temp <- tryCatch(
    {
      sheetid %>% read_sheet(sheet=kInputSheetName, range="A:A", col_names=T) %>% flatten_chr()
    },
    error = function(e) {
      NA  # エラーが発生した場合にNAを返す
    }
  )
  if (length(temp) == 0) {
    return(NULL)
  }
  jrctNoList <- temp %>% str_extract_all("jRCT[0-9]{10}") %>% flatten_chr()
  if (length(jrctNoList) == 0) {
    return(NULL)
  }
  return(jrctNoList)
}
ExecGetJrctList <- function() {
  if (is.na(sheetid)) {
    return(NULL)
  }
  AddSheet(kOutputSheetName)
  inputJrctNoList <- GetTargetJrctNoList()
  if (is.null(inputJrctNoList)) {
    return(NULL)
  }
  # 取得済みのjRCT番号は対象外とする
  retrievedJrctNo <- sheetid %>%
    read_sheet(sheet=kOutputSheetName, range="C:C", col_names=T) %>% flatten_chr() %>% unique()
  jrctNoList <- setdiff(inputJrctNoList, retrievedJrctNo)
  if (length(jrctNoList) == 0) {
    return(NULL)
  }
  urlList <- jrctNoList %>% str_c(kUrlHead, .)
  jrctList <- list()
  for (i in 1:length(urlList)){
    url <- urlList[i]
    temp <- tryCatch(
      {
        GetJrctTables(url)
      },
      error = function(e) {
        NA  # エラーが発生した場合にNAを返す
      }
    )
    jrctList[[i]] <- temp
  }
  names(jrctList) <- jrctNoList
  return(jrctList)
}
# ------ main ------
jrctList <- ExecGetJrctList()
df_jrctList <- bind_rows(jrctList)
# とりあえずtempシートに出力
WriteSheet(kWkSheetName, df_jrctList)
# outputシートに追記
sheetid %>% read_sheet(sheet=kOutputSheetName, range="C:C", col_names=T) %>% flatten_chr() %>% unique()
output_sheet <- sheetid %>% read_sheet(sheet=kOutputSheetName, col_names=F)
start_row <- nrow(output_sheet) + 1
end_row <- nrow(df_jrctList) + start_row
if (start_row > 1) {
  sheetid %>% range_write(df_jrctList, sheet=kOutputSheetName, range=str_c("A", start_row, ":C", end_row), col_names=F)
} else {
  sheetid %>% range_write(df_jrctList, sheet=kOutputSheetName, range=str_c("A", start_row, ":C", end_row), col_names=T)
}
