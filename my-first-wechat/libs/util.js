let fs = require('mz/fs')

exports.readAccessTokenAsync = (fpath,encoding) => {
    return fs.readFile(fpath,encoding).then(data=>{
        return data
    }).catch(e=>{
        console.log(e)
    })
}

exports.writeAccessTokenAsync = (fpath,content) => {
    return fs.writeFile(fpath,content).catch(e=>{
        console.log(e)
    })
}

exports.readTicketAsync = (fpath,content) => {
    return fs.writeFile(fpath,content).catch(e=>{
        console.log(e)
    })
}


exports.writeTicketAsync = (fpath,content) => {
    return fs.writeFile(fpath,content).catch(e=>{
        console.log(e)
    })
}
