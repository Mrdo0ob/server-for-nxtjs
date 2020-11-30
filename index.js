const express = require('express');
const port = process.env.port || 4000;
const app = express();
const fetch = require('node-fetch');

const mongoose = require('mongoose');
//Данный компонент написан для работы с MongoDB
const Address = require('./models/Address');
//Данные для подключения к моей БД на MongoDB
const uri = 'mongodb+srv://testUser:VLekfoaw234a@cluster0.6clzn.mongodb.net/addresses';


//Данные для запросов в DaData
const url = "https://cleaner.dadata.ru/api/v1/clean/address";
const token = "635c2d6c2290116a33b2b8d2c79c20b3d058264c";
const secret = "54c2fabb8f81b139c5fce4326b4e8278ea652271";

//Генератор запроса для DaData. Написан, чтоб не дублировать опции в коде
const reqOptionsCreator = (query) => {
    return {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Token " + token,
            "X-Secret": secret
        },
        body: JSON.stringify([query])
    }
};

//При запросе адреса
app.post('/', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");

    //Запись запроса
    const address = new Address({
        reqAddress: req.query.address
    });
    //Добавление записи в БД
    await address.save();

    //Создание опции запроса к DaData
    const options = reqOptionsCreator(req.query.address);

    //Запрос к DaData
    const data = await fetch(url, options)
        .then(response => response.json())
        .then(result => result)
        .catch(error => console.log("error", error));
    if (!data) res.json('Error 404');
    else res.json(data);
});

//При загрузке страницы
app.get('/', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");

    //Запрос к БД с нахождением случайной строки
    const randomAddress = await Address.aggregate([ { $sample: { size: 1 } } ]);
    //Деструктуризация полученного объекта
    const {reqAddress} = randomAddress.pop();

    //Создание опции запроса к DaData
    const options = reqOptionsCreator(reqAddress);
    //Запрос к DaData
    const data = await fetch(url, options)
        .then(response => response.json())
        .then(result => result)
        .catch(error => console.log("error", error));
    res.json(data);
});


//Загрузить все запросы. Добавлено в связи с реализацией БД на MongoDB, там сложности с разграничением доступа.
//Для доступа, пришлось бы высылать каждому пользователю приглашение в проект. Поэтому принял решение
//Сделать данную функцию, которая возвращает все значения из БД и отправляет на клиент
app.get('/all', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const address = await Address.find({}).lean();
    res.json(address);
});


//Подключение к MongoDB, затем запуск сервера
mongoose.connect(uri, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(app.listen(port, () => console.log(`Server started on port: ${port}`)));
