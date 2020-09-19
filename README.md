# covid-19-alert

| 정부에서 제공하는 코로나 지역별 확진자 통계 Open API를 이용해서 슬랙채널 알람을 주는 프로그램

## 설치
```
npm install
```

.env.prod 와 .env.test 파일을 생성 후 각 키값 등록 
```
SLACK_WEBHOOK_KEY=SLACK WEBHOOK KEY
DATA_API_KEY=OPEN API KEY
```

## 실행
* 테스트 환경 
```
node index.js --env=test
```
* 서비스 환경 
```
node index.js --env=prod
```
### 스크린 샷
<img src="https://raw.githubusercontent.com/zebra0303/covid-19-alert/master/screenshoot.png">
