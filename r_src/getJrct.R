#' title
#' description
#' @file getJrct.R
#' @author Mariko Ohtsuka
#' @date 2024.06.12
rm(list=ls())
# ------ libraries ------
library(tidyverse)
library(here)
library(googlesheets4)
library(rvest)
# ------ constants ------
kUrlHead <- "https://jrct.niph.go.jp/latest-detail/"
# ------ functions ------
GetWebPageData <- function(url){
  return(read_html(url))
}
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
  res <- GetBaseData(webpage)
  return(res)
}
# ------ main ------
# スクレイピング対象のURL
jrctList <- list()
jrctNoList <- c("jRCT2031230581")
urlList <- jrctNoList %>% str_c(kUrlHead, .)
for (i in 1:length(urlList)){
  url <- urlList[i]
  temp <- GetJrctTables(url)
  jrctList[[i]] <- temp
}
names(jrctList) <- jrctNoList
