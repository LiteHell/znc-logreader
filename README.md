# znc-logreader
Web irc log reader, made for znc users.

## Installation
1. Copy `config.example.json` to `config.json`
1. Edit `config.json`
1. Run necessary one of following.
   * `npm install pg pg-hstore`
   * `npm install mysql2`
   * `npm install sqlite3`
   * `npm install tedious` (MSSQL)
1. Run `npm i`
1. Run `npm run start`

## Add/Manage account
Use LDAP. `%u` in dn is replaced with id.

## reCAPTCHA
You can use Google Invisible reCAPTCHA by editing `config.json`.

## License
Copyright (c) 2017 LiteHell

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
