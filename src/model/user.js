const { createReadStream, writeFile } = require('fs')
const path = require('path')

const dbJsonPath = path.resolve(process.cwd(), 'services/db_users.json')
const dbJsonCatsPath = path.resolve(process.cwd(), 'services/db_cats.json')

const readJSONAsync = (path) => new Promise((resolve) => {
    const readStream = createReadStream(path)
    let result = ''
    readStream
        .on('data', (chunk) => {
            result += chunk.toString()
        })
        .on('end', (chunk) => {
            if (!result) {
                resolve([])
            } else {
                resolve(JSON.parse(result))
            }
        })
})

const writeJSONAsync = (path, data) => new Promise((resolve, reject) => {
    const buff = Buffer.from(JSON.stringify(data, null, 4))
    writeFile(path, buff, (err) => {
        err ? reject(err) : resolve()
    })
})

exports.fetchAllUsers = () => {
    return readJSONAsync(dbJsonPath)
}

exports.addNewUser = async (data) => {
    const users = await readJSONAsync(dbJsonPath)
    users.push(data)
    await writeJSONAsync(dbJsonPath, users)
}

exports.fetchUserById = async (id) => {
    const users = await readJSONAsync(dbJsonPath)
    const user = users.find((user) => user.id === id)
    const cats = await readJSONAsync(dbJsonCatsPath)
    const userCat = cats.filter((cat) => cat.ownerId === user.id)
    user.pets = []
    userCat.map(cat => user.pets.push(cat))
    return user
}

exports.update = async (dataOfNewUser) => {
    const users = await readJSONAsync(dbJsonPath)
    const foundUserIndex = users.findIndex(user => user.id === dataOfNewUser.id)
    if (foundUserIndex === -1) {
        return false
    }
    users[foundUserIndex] = dataOfNewUser
    await writeJSONAsync(dbJsonPath, users)
    return true
}

exports.deleteUserById = async (id) => {
    const users = await readJSONAsync(dbJsonPath)
    let userBeenFound = false
    const filteredUsers = users.filter(user => {
        if (user.id !== id) {
            return true
        }
        userBeenFound = true
        return false
    })
    if (userBeenFound) {
        const cats = await readJSONAsync(dbJsonCatsPath)
        cats.forEach(cat => {
            if (cat.ownerId === id) {
                cat.ownerId = null
            }
        })
        await writeJSONAsync(dbJsonCatsPath, cats)
        await writeJSONAsync(dbJsonPath, filteredUsers)
        return true
    }
    return false
}

exports.deleteUsers = async (data) => {
    const users = await readJSONAsync(dbJsonPath)
    const cats = await readJSONAsync(dbJsonCatsPath)
    const usersAfterDelete = users.reduce((afterDelete, user) => {
        if (!data.find((id) => id === user.id)) {
            afterDelete.push(user)
            cats.find((cat) => {
                if (data.includes(cat.ownerId)) {
                    cat.ownerId = null
                }
            })
        }
        return afterDelete
      }, [])
      await writeJSONAsync(dbJsonCatsPath, cats)
      await writeJSONAsync(dbJsonPath, usersAfterDelete)
}
