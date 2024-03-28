const fetch = require('node-fetch')
module.exports = {
    async searchMovie (content) {
        let data = await fetch(`${this.api.search}?q=${encodeURIComponent(content)}`).then(res => res.json())
        console.log(data,'{}{}{');
        
        return data.subjects || [] 
    },
    api:{
        search:'https://api.douban.com/v2/movie/search'
    }
}