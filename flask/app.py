from flask import Flask, make_response
import urllib.request as urllib2
from bs4 import *
app = Flask(__name__)
app.url_map.strict_slashes = False

@app.route("/favicon.ico")
def favicon():
    return ''

@app.route("/<path:path>/")
def getId(path):
    path = 'https://' + path[path.find('www'):]
    page = urllib2.urlopen(path)
    soup = BeautifulSoup(page.read())
    idEl = soup.select('meta[itemprop="channelId"]')
    response = make_response(idEl[0]['content'])

    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

if __name__ == '__main__':
    app.run(debug=True, port=5000)