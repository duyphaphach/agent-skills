# Publishing reference

`publish.mjs` ships a file to one channel. `credentials.mjs` stores the credentials so they are entered once.

## Credentials

`publish.mjs` reads credentials from environment variables. Any variable not set in the environment is loaded from `~/marketing-pipeline/.credentials`. An environment variable that is set wins over the file.

Save credentials there with `credentials.mjs`. It reads `KEY=VALUE` lines from stdin (not arguments, which would show in the process list), creates the file owner-only:

```bash
node scripts/credentials.mjs set <<'EOF'
WP_BASE_URL=https://blog.example.com
WP_USERNAME=editor
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx
EOF

node scripts/credentials.mjs list    # show stored keys, values masked
node scripts/credentials.mjs path    # print the file path
```

The file is `chmod 600`, the folder `chmod 700`. It lives in the home directory, outside the repo. Never commit a credential.

## publish.mjs usage

```bash
node scripts/publish.mjs <channel> <file> [--title "Post title"] [--status draft|publish] [--link URL] [--dry-run]
```

| Flag | Meaning |
|------|---------|
| `channel` | `wordpress`, `facebook`, or `linkedin` |
| `file` | Content to post. HTML for WordPress, plain text for social |
| `--title` | Required for WordPress, ignored elsewhere |
| `--status` | WordPress only. `draft` (default) or `publish` |
| `--link` | Optional URL appended to a social post |
| `--dry-run` | Print what would be sent, send nothing. Credentials in the output are masked |

Exits non-zero on a missing variable, an API error, or a missing file. Try `--dry-run` first.

## Variables per channel

### WordPress

REST API with an application password.

| Variable | Example |
|----------|---------|
| `WP_BASE_URL` | `https://blog.example.com` |
| `WP_USERNAME` | `editor` |
| `WP_APP_PASSWORD` | `xxxx xxxx xxxx xxxx xxxx xxxx` |

Create the application password in WordPress under Users > Profile > Application Passwords. It is not the login password.

### Facebook

Posts to a Page feed via the Graph API.

| Variable | Example |
|----------|---------|
| `FB_PAGE_ID` | `123456789012345` |
| `FB_PAGE_TOKEN` | Page access token with `pages_manage_posts` |

Use a long-lived Page token. Short-lived tokens expire within hours.

### LinkedIn

Posts a share via the UGC Posts API.

| Variable | Example |
|----------|---------|
| `LI_ACCESS_TOKEN` | OAuth token with `w_member_social` |
| `LI_AUTHOR_URN` | `urn:li:person:xxxx` or `urn:li:organization:xxxx` |

The author URN decides whether the post lands on a personal profile or a company page.

## Notes

- A blog article is too long for a Facebook or LinkedIn feed post. For those channels, publish a short promo post (hook, summary, link), not the full article.
- WordPress receives the full article as HTML.
- The script sends the file content as-is. It does not convert Markdown. Pass HTML for WordPress, plain text for social.
