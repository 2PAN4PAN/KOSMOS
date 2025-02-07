const express = require('express');
const app = express();

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs') 
app.use(express.json())
app.use(express.urlencoded({extended:true}))



// 정적 파일 경로 설정
app.use(express.static(__dirname + '/public'));

// 뷰 엔진 설정
app.set('view engine', 'ejs');

// JSON, URL 인코딩된 데이터 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB 클라이언트 설정
const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://2pan4pan:2pan4pan@2pan4pan.xq7l6.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri);

// MongoDB 연결 함수
async function connectDB() {
    try {
        await client.connect();
        console.log('✅ MongoDB 공용 DB 연결 성공!');
        const db = client.db('2pan4pan');
        const collections = await db.listCollections().toArray();
        console.log('📌 현재 컬렉션 목록:', collections);
    } catch (err) {
        console.error('❌ MongoDB 연결 실패:', err);
    }
}

connectDB();

// 라우터 분리된 파일 불러오기
const deskRouter = require('./routes/desk'); // desk.js 라우터 불러오기

// 라우터 사용
app.use('/api/book', deskRouter); // '/api/book' 경로에서 desk.js 라우터 사용

// 서버 실행
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
