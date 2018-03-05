// WIRED

/* global muxbots */

function selectArticle (rssFeed) {
  var viewed = muxbots.localStorage.getItem('viewed')
  if (viewed === undefined) {
    viewed = { 'articles': [ rssFeed[0].url ] }
    muxbots.localStorage.setItem('viewed', viewed)
    return rssFeed[0]
  }

  var newViewed = { 'articles': [] }

  var articleSelect

  for (let i = 0; i < rssFeed.length; i++) {
    var articlefound = viewed.articles.indexOf(rssFeed[i].url)
    if (articlefound >= 0) {
      newViewed.articles.push(rssFeed[i].url)
    } else {
      if (articleSelect === undefined) {
        articleSelect = rssFeed[i]
      }
    }
  }

  if (articleSelect !== undefined) {
    newViewed.articles.push(articleSelect.url)
  }

  muxbots.localStorage.setItem('viewed', newViewed)

  return articleSelect
}

muxbots.onFeedPull((callback) => {
  var currentTime = new Date()

  var lastfetch = muxbots.localStorage.getItem('lastfetch')
  var lastfetchtime = lastfetch === undefined ? 0 : lastfetch.time

  if ((currentTime.getTime() - lastfetchtime) < 300000) {
    var rssFeed = muxbots.localStorage.getItem('rssFeed')

    var article = selectArticle(rssFeed.articles)

    if (article === undefined) {
      muxbots.newResponse()
        .send(callback, 'No more new articles.')
    } else {
      muxbots.newResponse()
        .addWebpage(muxbots.newWebpage()
          .setTitle(article.title)
          .setURL(article.url)
          .setImage(article.imageurl))
        .send(callback)
    }
  } else {
    muxbots.http.get('https://www.wired.com/feed/rss', function (response) {
      var rssItems = response.data.split('<item>')

      var rssFeed = { 'articles': [] }
      for (let i = 1; i < rssItems.length; i++) {
        rssFeed.articles.push({
          'title': `${rssItems[i].split('<title>')[1].split('<')[0]}`,
          'url': `${rssItems[i].split('<link>')[1].split('<')[0]}`,
          'imageurl': `${rssItems[i].split('<media:thumbnail')[1].split('url="')[1].split('"')[0]}`
        })
      }

      muxbots.localStorage.setItem('rssFeed', rssFeed)
      muxbots.localStorage.setItem('lastfetch', { 'time': currentTime.getTime() })

      var article = selectArticle(rssFeed.articles)

      if (article === undefined) {
        muxbots.newResponse()
          .send(callback, 'No more new articles.')
      } else {
        muxbots.newResponse()
          .addWebpage(muxbots.newWebpage()
            .setTitle(article.title)
            .setURL(article.url)
            .setImage(article.imageurl))
          .send(callback)
      }
    })
  }
})
