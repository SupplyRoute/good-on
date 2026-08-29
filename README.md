# Good on

피그먼트 다잉 베이직 저지 브랜드 **Good on**을 위한 한국어 정적 홈페이지입니다.

## 실행

빌드 과정이 없습니다. 저장소 최상위의 `index.html`을 브라우저에서 열거나 간단한 정적 서버로 실행하세요.

```bash
python -m http.server 8000
```

그 후 `http://localhost:8000`에서 확인할 수 있습니다.

## 파일

- `index.html` — 홈, 대표 제품, 이야기, 연락하기 섹션
- `products.html` — 전체 제품 카탈로그
- `about.html` — 브랜드 역사와 피그먼트 다잉 공정 소개
- `products.json` — 제품명, 가격, 이미지, 구매 링크의 단일 데이터 원본
- `color-stories.json` — 홈 컬러 루프의 이름, 색상값, 인스타그램 링크
- `styles.css` — 반응형 스타일과 디자인 토큰
- `script.js` — 컬러 루프, 모바일 메뉴, 스크롤 효과, 문의 폼 검증
- `assets/good-on-jersey-hero.png` — 생성형 AI로 제작한 임시 제품 비주얼
- `assets/tee-cutout.png` — 컬러 루프에 사용하는 투명 배경 티셔츠 누끼
- `assets/logo_blue.svg` — 헤더에 사용하는 Good On 공식 로고
- `DESIGN.md` — 브랜드 디자인 방향과 유지보수 기준

제품을 추가하거나 수정할 때는 `products.json`만 편집하면 홈과 제품 페이지에 함께 반영됩니다. 이메일, 주소와 문의 폼 전송 기능은 실제 운영 정보로 교체해야 합니다.
