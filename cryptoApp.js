'use strict';
const fs = require('fs');
const fetch = require('node-fetch');
const crypto = require('crypto');
const FormData = require('form-data');

const token = '8e5eab0f06cb737845063db0c7dd8f95229c5b03';
const reqUrl = `https://api.codenation.dev/v1/challenge/dev-ps/generate-data?token=${token}`;
const sendUrl = `https://api.codenation.dev/v1/challenge/dev-ps/submit-solution?token=${token}`;

const alfabeto = 'abcdefghijklmnopqrstuvwxyz';

const loadApi = function(url) {
    const response = (resolve, reject) => {
        fetch(url)
            .then(res => {
                if(!res.ok) throw new Error('Erro na requisição, status ' + res.status);
                return res.json();
            })
            .then(resolve)
            .catch(reject)
    };
    return new Promise(response)
};

const write = (file, data) => {
    fs.writeFile(file, data, (error) => {
        if (error) throw error;
    });
};

const decrypt = function(num, cifrado){
    let decifrado = [];
    for(let i = 0; i < cifrado.length; i++){
        let charIndex = alfabeto.indexOf(cifrado[i]);
        if (charIndex > 0){
            if(charIndex == alfabeto.length){
                decifrado[i] = alfabeto.charAt(num - 1);
            } else if (charIndex - num >= alfabeto.length){
                decifrado[i] = alfabeto.charAt(((charIndex - num) - alfabeto.length));
            } else {
                decifrado[i] = alfabeto.charAt(charIndex - num);
            }
        } else {
            decifrado[i] = cifrado[i];
        };
    };
    return decifrado.join('');
};

const sendApi = (url, data) => {

    fetch(url, {
        method: 'POST',
        headers: {
            ...data.getHeaders()
        },
        body: data
    })
    .then(res => res.text())
    .then(text => console.log(text))
    .catch(error => console.log(error));
}

const cryptoApp = async () => {
    let answerData = {};

    //Faz requisição para API e cria arquivo JSON
    await loadApi(reqUrl)
        .then(data => {
            answerData = JSON.stringify(data);
            write('answer.json', answerData);
    }).catch(console.error);

    //Atualiza object answerData com dados da requisição passada para o arqivo JSON
    answerData = JSON.parse(answerData);
    answerData.cifrado = answerData.cifrado.toLowerCase();

    //Atualiza object answerData com dados decifrados
    answerData.decifrado = decrypt(answerData.numero_casas, answerData.cifrado).toLowerCase();
    
    //Atualiza arquivo com atributo decifrado do object answerData
    write('answer.json', JSON.stringify(answerData));
    
    //Atualiza object answerData com atributo resumo_criptografico
    const sha1 = crypto.createHash('sha1').update(answerData.decifrado).digest('hex');
    answerData.resumo_criptografico = sha1;
    
    //Atualiza arquivo com atributo resumo_criptografico do object answerData
    write('answer.json', JSON.stringify(answerData, undefined, 4));

    let formData = new FormData();
    // formData.append("answer", JSON.stringify(answerData), "answer.json");
    formData.append("answer", fs.createReadStream("answer.json"));

    sendApi(sendUrl, formData);
};

cryptoApp();

