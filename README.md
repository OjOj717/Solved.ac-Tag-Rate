# 🎯 Solved.ac-Tag-Rate

<div align="center">

  <br><br>

  ![Algo Radar](https://solved-ac-tag-rate.vercel.app/api?handle=ojoj_717)

  </a>

  <br><br>
</div>

<br>

## 💡 ABOUT PROJECT

**내 알고리즘 능력치는 어떤 모양일까?** <br>
Solved.ac API를 활용해 Beakjoon에서 푼 알고리즘 문제들의 태그 분포를 svg로 변환해 Github README등에서 활용할 수 있게 만든다.

<br>

### ✨ Key Features

* **📊 Dynamic Visualization**: 실시간 API 데이터를 기반으로 생성되는 **SVG 레이더 차트**
* **🎨 Custom mode**: 언어, 테마등 **커스텀 가능**
* **⚡ Vercel Serverless**: 별도의 서버 구축 없이 Vercel Edge Functions로 빠른 응답 속도 제공

<br>

## 🗓️ PROJECT PERIOD
> **2026.02.06 ~**

<br>

## 🛠️ TECH STACK
<div align="center">
<br>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"> <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black"> <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white"> <img src="https://img.shields.io/badge/SVG-FFB13B?style=for-the-badge&logo=svg&logoColor=white">


<img src="https://img.shields.io/badge/Solved.ac_API-101010?style=for-the-badge&logo=target&logoColor=white">
<img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white">
</div>

<br>

## 🚀 HOW TO USE

**{YOUR_ID} 부분을 자신의 solved.ac(boj) 아이디로 바꾸어 작성.**
```
![Solved.ac Rating](https://solved-ac-tag-rate.vercel.app/api?handle={YOUR_ID})
```

### ⚙️ Custom

| Parameter | Description | Element | Default |
| --------- | --------- | --------- | --------- |
| handle | 사용자 아이디 | - | - |
| lang | 태그 언어 설정 | ko, en, ja | en |
| theme | 색상 테마 설정 | light, dark, paper | light |


## 📂 DIRECTORY STRUCTURE

<pre> 
<b>Solved.ac-Tag-Rate</b> 
├── 📂 <b>api/</b> 
│ └── ⚙️ <b>index.js</b> <font color="#777"># 메인 서버리스 로직 (API 호출 및 SVG 렌더링)</font> 
└── 📄 <b>package.json</b> <font color="#777"># 프로젝트 의존성 관리 (axios 등)</font> 
</pre>

<br>

## 👤 AUTHOR

<div align="center">
  <br>
  <img src="https://github.com/ojoj717.png" width="110" height="110" style="border-radius: 50%; border: 3px solid #332c69;">
  <br>
  
  ### **Ojing-Ojing (군오징)**
  
  [![GitHub Badge](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ojoj717)
</div>

<br>

## 🎬 CREDITS
이 프로젝트는 아래의 오픈소스 및 리소스의 도움을 받아 제작되었습니다.
* **[Gemini](https://gemini.google.com/)**: 코드 로직 작성 도움
* **[solved.ac API](https://solved.ac/api/v3/)**: 유저 데이터 제공
* **[Axios](https://axios-http.com/)**: 외부 API 통신을 위한 Promise 기반 HTTP 클라이언트
* **[Vercel](https://vercel.com/)**: Serverless Functions를 이용한 프로젝트 배포 및 호스팅
* **[Node.js](https://nodejs.org/)**: 서버 측 자바스크립트 실행 환경
* **[Shields.io](https://shields.io/)**: 리드미 작성

<br>

---

<div align="center">
  <p>This project is licensed under the <b>MIT License</b>.</p>
  <p>© 2026 <b>ojoj717</b>. Some rights reserved.</p>
</div>


