terraform {
  cloud {
    organization = "jamcswain"

    workspaces {
      name = "api-KandJ-wedding"
    }
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.26.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "3.21.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "2.2.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

data "cloudflare_zone" "site-zone" {
  name = var.site-name
}

data "aws_api_gateway_domain_name" "url" {
  domain_name = "api.kandj.wedding"
  depends_on = [
    aws_apigatewayv2_api_mapping.mapping
  ]
}

resource "cloudflare_record" "api" {
  zone_id = data.cloudflare_zone.site-zone.id
  name    = "api"
  value   = data.aws_api_gateway_domain_name.url.regional_domain_name
  type    = "CNAME"
  proxied = false
  ttl     = 60
}
