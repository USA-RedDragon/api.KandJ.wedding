resource "aws_dynamodb_table" "rsvps" {
  name           = var.app_rsvp_table_name
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "rsvp-code"

  attribute {
    name = "rsvp-code"
    type = "S"
  }

  tags = {
    Name = var.app_rsvp_table_name
  }
}
