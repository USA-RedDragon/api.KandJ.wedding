variable "site-name" {
  type    = string
  default = "kandj.wedding"
}

variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "app_secret" {
  type      = string
  sensitive = true
}

variable "app_salt" {
  type      = string
  sensitive = true
}

variable "app_rsvp_table_name" {
  type      = string
  sensitive = true
}

variable "app_basic_auth_password" {
  type      = string
  sensitive = true
}

variable "app_telegram_bot_token" {
  type      = string
  sensitive = true
}

variable "app_telegram_group_id" {
  type      = string
  sensitive = true
}
