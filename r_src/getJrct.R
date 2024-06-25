#' title
#' description
#' @file getJrct.R
#' @author Mariko Ohtsuka
#' @date 2024.06.18
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
GetBaseDataJrct <- function(webpage){
  captions <-  webpage %>% html_node(xpath = '/html/body/div/div[2]/table/tbody') %>% GetTables()
  # XPathを使って特定のテーブル要素を抽出
  managerial_matter <- webpage %>% html_node(xpath = '//*[@id="area-toggle-00"]/table/tbody') %>% GetTables()
  temp <- webpage %>% html_node(xpath = '//*[@id="area-toggle-02-01"]/table/tbody') %>% GetTables()
  temp$Label <- temp$Label %>% str_remove_all("\\s")
  trialBody <- temp %>%
    filter(str_detect(Label, "試験等の目的") |
           str_detect(Label, "実施予定被験者数") |
           str_detect(Label, "実施期間")|
           str_detect(Label, "年齢")|
           str_detect(Label, "介入")
          )
  res <- bind_rows(captions, managerial_matter, trialBody)
  jrctNo <- res %>% filter(str_detect(Label, "jRCT番号") | str_detect(Label, kIdLabel)) %>% .[ , kOutputHeader[2], drop=T]
  res$jrctNo <- jrctNo
  return(res)
}
GetJrctTables <- function(jrctNo) {
  url <- jrctNo %>% str_c(kUrlHead, .)
  webpage <- GetWebPageData(url)
  Sys.sleep(5)
  res <- GetBaseDataJrct(webpage)
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
  jrctNoList <- temp %>% str_extract_all(kJRCTNo) %>% flatten_chr()
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
  jrctNoList <- setdiff(inputJrctNoList, retrievedJrctNo) %>% unique()
  if (length(jrctNoList) == 0) {
    return(NULL)
  }
  jrctList <- list()
  for (i in 1:length(jrctNoList)){
    jrctNo <- jrctNoList[i]
    temp <- tryCatch(
      {
        GetJrctTables(jrctNo)
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
targetJrctNoList <- targetList$jRCT %>% setdiff(existJrctUminNoList$jRCT)
jrctList <- ExecGetJrctList()
df_jrctList <- bind_rows(jrctList)
AddOutputSheet(df_jrctList)
