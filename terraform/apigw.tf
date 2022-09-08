resource "aws_apigatewayv2_api" "api" {
  name                         = "api-kandj-wedding"
  protocol_type                = "HTTP"
  disable_execute_api_endpoint = true
}

resource "aws_apigatewayv2_domain_name" "domain" {
  domain_name = "api.kandj.wedding"

  domain_name_configuration {
    certificate_arn = aws_acm_certificate.site.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  depends_on = [
    aws_acm_certificate_validation.validation
  ]
}

resource "aws_apigatewayv2_api_mapping" "mapping" {
  api_id      = aws_apigatewayv2_api.api.id
  domain_name = aws_apigatewayv2_domain_name.domain.id
  stage       = aws_apigatewayv2_stage.stage.id
}

resource "aws_apigatewayv2_stage" "stage" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "integration" {
  api_id           = aws_apigatewayv2_api.api.id
  integration_type = "AWS_PROXY"

  connection_type    = "INTERNET"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.lambda.invoke_arn
}

resource "aws_apigatewayv2_route" "ping" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/ping"

  target = "integrations/${aws_apigatewayv2_integration.integration.id}"
}

resource "aws_apigatewayv2_route" "version" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/version"

  target = "integrations/${aws_apigatewayv2_integration.integration.id}"
}

resource "aws_apigatewayv2_route" "rsvp" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /api/v1/rsvp"

  target = "integrations/${aws_apigatewayv2_integration.integration.id}"
}

resource "aws_apigatewayv2_route" "rsvpCode" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /api/v1/rsvpCode"

  target = "integrations/${aws_apigatewayv2_integration.integration.id}"
}

resource "aws_apigatewayv2_route" "rsvps" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/v1/rsvps"

  target = "integrations/${aws_apigatewayv2_integration.integration.id}"
}

resource "aws_apigatewayv2_route" "options" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "OPTIONS /{cors+}"

  target = "integrations/${aws_apigatewayv2_integration.integration.id}"
}
