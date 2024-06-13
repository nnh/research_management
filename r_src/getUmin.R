#' title
#' description
#' @file getUmin.R
#' @author Mariko Ohtsuka
#' @date 2024.6.12
rm(list=ls())
# ------ libraries ------
library(here)
source(here("r_src", "scraping_common.R"), encoding="utf-8")
library(httr)
# ------ constants ------
kTestConstants <- NULL
# ------ functions ------
TestFunction <- function(){

}
# ------ main ------
url <- "https://upload.umin.ac.jp/cgi-open-bin/ctr/index.cgi"
uminId <- "UMIN000027218"
# POSTリクエストに送信するデータ
payload <- list(
  sort = '03',
  `function` = '04',  # 'function'はRでは予約語なのでバッククォートで囲む
  ctrno = uminId
)

# POSTリクエストを送信し、結果を取得
response <- POST(url, body = payload, encode = "form")

# レスポンスの内容をUTF-8で表示
content <- content(response, "text", encoding = "UTF-8")

print(content)
str_detect(content, "R000030669")
