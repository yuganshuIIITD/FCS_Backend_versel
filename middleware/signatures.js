const express = require('express');
const crypto = require('crypto');


const generate_key_pair = () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'spki',
            format: 'der'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'der'
        }
    });

    return {publicKey: publicKey.toString('base64'), privateKey: privateKey.toString('base64')};
};




// const sign_function = (data, privateKey) => {
const sign = (req, res, next) => {
    try {
        const data = req.body.data;
        const privateKey = req.body.privateKey;
    
        const signature = sign_function(data, privateKey);
    
        res.json({data: data, signature: signature});            
    } catch (error) {
        next(error);
    }
};

const verify_function = (data, signature, publicKey) => {
    publicKey = crypto.createPublicKey({
        key: Buffer.from(publicKey, 'base64'),
        format: 'der',
        type: 'spki'
    });
    const verifier = crypto.createVerify('SHA256');
    verifier.update(data);
    verifier.end();

    const verified = verifier.verify(publicKey, Buffer.from(signature, 'base64'));
    return verified;
};

const verify = (req, res, next) => { 
    try {
        const data = req.body.data;
        const signature = req.body.signature;
        const publicKey = req.body.publicKey;
    
        const verified = verify_function(data, signature, publicKey);
    
        res.json({verify: verified});            
    } catch (error) {
        next(error);
    }
};

module.exports = { sign, verify, sign_function, verify_function, generate_key_pair};