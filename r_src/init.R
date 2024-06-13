#' title
#' description
#' @file init.R
#' @author Mariko Ohtsuka
#' @date YYYY.MM.DD
rm(list=ls())
# ------ libraries ------
library(here)
library(tidyverse)
library(googlesheets4)
library(rvest)
# ------ constants ------
# ------ functions ------
# ------ main ------
# google authentication
gs4_auth(
  email = gargle::gargle_oauth_email(),
  scopes = "https://www.googleapis.com/auth/spreadsheets",
  cache = gargle::gargle_oauth_cache(),
  use_oob = gargle::gargle_oob_default(),
  token = NULL)
