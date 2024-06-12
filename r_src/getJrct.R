#' title
#' description
#' @file xxx.R
#' @author Mariko Ohtsuka
#' @date YYYY.MM.DD
rm(list=ls())
# ------ libraries ------
library(tidyverse)
library(here)
library(googlesheets4)
library(rvest)

# ------ constants ------
kTestConstants <- NULL
# ------ functions ------
GetWebPageData <- function(url){
  return(read_html(url))
}
GetBaseData <- function(webpage){
  body <- webpage %>% html_node("body")
  bodytop <- body %>% html_node("div")
  tables <- webpage %>% html_nodes(".jr-caption") %>% html_nodes("table") %>% html_nodes("tbody")
  # class="jr-caption"のDIV要素を抽出
  captions <- tables[[1]] %>% html_nodes("tr") %>% html_nodes("td") %>%
    html_text()
  # 各行のTHタグのラベルとTDタグの内容を取得してデータフレームにする
  captions <- tables[[1]] %>% html_nodes("tr") %>% map_df( ~ {
    th <- .x %>% html_node("th") %>% html_text(trim = TRUE)
    td <- .x %>% html_node("td") %>% html_text(trim = TRUE)
    data.frame(Label = th, Value = td, stringsAsFactors = FALSE)
  })
  # 研究名
  # 治験調整医師名
  # 治験調整医師所属
  # 届出日
}
# ------ main ------
# スクレイピング対象のURL
url <- "https://jrct.niph.go.jp/latest-detail/jRCT2031230581"

  # HTMLコンテンツを読み込む
  webpage <- read_html(url)

# 必要な情報を抽出する（例としてタイトルを抽出）
title <- webpage %>%
  html_node("h1") %>%
  html_text()

# さらに詳細な情報を抽出（例としてすべてのテーブルデータを抽出）
tables <- webpage %>%
  html_nodes("table") %>%
  html_table()

# 最初のテーブルのデータを表示
first_table <- tables[[1]]
print(first_table)
