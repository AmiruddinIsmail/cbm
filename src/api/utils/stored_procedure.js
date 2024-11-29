const connection = require('../middlewares/db.js')

export function storedProcedure(query){
    let result = connection.execute(query, function(err, results, field){
        if(err) console.log("error on using store procedure")
        return results
    })

    return result
}