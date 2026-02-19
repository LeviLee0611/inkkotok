# Resend DNS Records (inkkotok.com)

Resend 도메인 인증 시 표시된 Cloudflare DNS 레코드 기록입니다.

## Authorization note
- This is a one-time authorization.
- It does not grant Resend permission to make future changes.

## Records

1. TXT
- Name: `resend._domainkey`
- Content:
  `"p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDBXZX6HZnVtu4/qWDQxEFzbUnAHAbfUCBy+kIATjSH9gNeSkaqT8AMO9zFgptx3itQJKkgXvlc5PsQzCVbx1RsbGAixicjthn6LqLs30U+4mFxUxfzcs2koUK0nUXaSmj8gIhylUJ+YPJ5meZ1U7hfPJXNygx5dk0v57MBOy50AQIDAQAB"`
- TTL: `1 hr`
- Proxy status: `DNS only`

2. MX
- Name: `send`
- Content: `feedback-smtp.us-east-1.amazonses.com`
- Priority: `10`
- TTL: `1 hr`
- Proxy status: `DNS only`

3. TXT
- Name: `send`
- Content: `"v=spf1 include:amazonses.com ~all"`
- TTL: `1 hr`
- Proxy status: `DNS only`
