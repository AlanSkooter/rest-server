const userModel = require('../model/user')
const { v4: uuid } = require('uuid')

const getNotFoundResponse = (res) => {
    res.writeHead(404)
    return {
        error: {
            message: "Not found",
            code: 404
        }
    }
}

const parseJsonBody = (request) => new Promise((resolve, reject) => {
    let rawJson = ''
    request
        .on('data', (chunk) => {
            rawJson += chunk
        })
        .on('end', () => {
            try {
                if (rawJson) {
                    const requestBody = JSON.parse(rawJson)
                    resolve(requestBody)
                } else {
                    resolve(null)
                }
            } catch (err) {
                reject(err)
            }
        })
        .on('error', reject)
})

exports.getUsers = async () => {
    const users = await userModel.fetchAllUsers()
    if (!users.length) {
        return getNotFoundResponse(res)
    }
    return users
}

exports.createUser = async (req) => {
    const userData = await parseJsonBody(req)
    userData.id = uuid()
    await userModel.addNewUser(userData)
    return {
        userData
    }
}

exports.getUserById = async (res, userId) => {
    const user = await userModel.fetchUserById(userId)
    if (!user) {
        return getNotFoundResponse(res)
    }
    return user
}

exports.updateUserById = async (req, res, userId) => {
    const updateData = await parseJsonBody(req)
    const user = await userModel.fetchUserById(userId)
    const updatedUser = { ...user, ...updateData }
    const updateResult = await userModel.update(updatedUser)
    if (!updateResult) {
        return getNotFoundResponse(res)
    }
    return updatedUser
}

exports.deleteUserById = async (res, userId) => {
    const updateResult = await userModel.delete(userId)
    if (!updateResult) {
        return getNotFoundResponse(res)
    }
    return {
        id: userId
    }
}