resource "aws_iam_role" "iam_for_lambda" {
  name = "iam_for_lambda"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_lambda_function" "lambda" {
  function_name = "api-kandj-wedding"
  role          = aws_iam_role.iam_for_lambda.arn
  handler       = "lambda.handler"

  s3_bucket = aws_s3_object.dist.bucket
  s3_key    = aws_s3_object.dist.key

  source_code_hash = data.archive_file.lambda.output_base64sha256

  runtime = "nodejs14.x"

  environment {
    variables = {
      NODE_ENV            = "production"
      SECRET              = var.app_secret
      SALT                = var.app_salt
      RSVP_TABLE_NAME     = var.app_rsvp_table_name
      BASIC_AUTH_PASSWORD = var.app_basic_auth_password
      TELEGRAM_BOT_TOKEN  = var.app_telegram_bot_token
      TELEGRAM_GROUP_ID   = var.app_telegram_group_id
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_logs,
    aws_cloudwatch_log_group.logs,
  ]
}

resource "aws_cloudwatch_log_group" "logs" {
  name              = "/aws/lambda/api-kandj-wedding"
  retention_in_days = 90
}

resource "aws_iam_policy" "lambda_logging" {
  name        = "lambda_logging"
  path        = "/"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_policy" "dynamodb" {
  name        = "lambda_dynamodb"
  path        = "/"
  description = "IAM policy for dynamodb from a lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem"
        ]
        Resource = [
          aws_dynamodb_table.rsvps.arn,
        ]
      }
    ]
  })
}

resource "aws_lambda_permission" "lambda_permission" {
  statement_id  = "AllowAPIKandJWeddingInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda.function_name
  principal     = "apigateway.amazonaws.com"

  # The /*/*/* part allows invocation from any stage, method and resource path
  # within API Gateway REST API.
  source_arn = "${aws_apigatewayv2_api.api.execution_arn}/*/*/*"
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = aws_iam_policy.dynamodb.arn
}

resource "aws_s3_object" "dist" {
  bucket       = aws_s3_bucket.lambda-bucket.id
  key          = "dist.zip"
  source       = data.archive_file.lambda.output_path
  etag         = data.archive_file.lambda.output_md5
  content_type = "application/zip"
}

data "archive_file" "lambda" {
  type             = "zip"
  source_dir       = "${path.module}/.."
  output_file_mode = "0666"
  output_path      = "${path.module}/dist.zip"

  excludes = ["terraform", ".github", ".git", ".eslintrc", ".gitignore", ".terraformignore", "README.md", "LICENSE.md"]
}

resource "aws_s3_bucket" "lambda-bucket" {
  bucket = "api-kandj-wedding-lambda"

  tags = {
    Name = "api-kandj-wedding-lambda"
  }
}
