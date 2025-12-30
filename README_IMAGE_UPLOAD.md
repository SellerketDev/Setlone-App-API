# 이미지 업로드 가이드

## 지원하는 방식

### 1. Base64 인코딩 (과거 방식, 현재도 지원)
- **방식**: 이미지를 Base64로 인코딩하여 DB에 직접 저장
- **장점**: 
  - 외부 스토리지 불필요
  - DB에 모든 데이터가 저장됨
- **단점**: 
  - DB 크기 증가 (이미지가 클수록 더 큼)
  - 성능 저하 가능
  - VARCHAR(500)로는 부족하여 TEXT 타입 필요

**사용 예시:**
```javascript
// 프론트엔드에서
const reader = new FileReader();
reader.onloadend = () => {
  const base64 = reader.result; // "data:image/jpeg;base64,/9j/4AAQ..."
  // API에 base64 문자열 전송
  fetch('/api/v1/users/1/profile', {
    method: 'PUT',
    body: JSON.stringify({ profile_image: base64 })
  });
};
reader.readAsDataURL(file);
```

### 2. 파일 시스템 저장 (현재 일반적, 권장)
- **방식**: 파일을 서버 디스크에 저장하고 URL만 DB에 저장
- **장점**: 
  - DB 부담 적음
  - 성능 좋음
  - 간단한 구현
- **단점**: 
  - 서버 디스크 관리 필요
  - 서버 확장 시 복잡할 수 있음

**사용 예시:**
```javascript
// 파일 업로드 API 사용
const formData = new FormData();
formData.append('image', file);

fetch('/api/v1/users/1/profile/image', {
  method: 'POST',
  body: formData
});
```

## 현재 구현 상태

### DB 스키마
- `profile_image` 필드: **TEXT** 타입 (Base64 지원)
- Base64 문자열 또는 URL 저장 가능

### API 엔드포인트

#### 1. Base64 방식
```
PUT /api/v1/users/:userId/profile
Body: {
  "profile_image": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

#### 2. 파일 업로드 방식
```
POST /api/v1/users/:userId/profile/image
Content-Type: multipart/form-data
Body: image file
```

### 저장 위치
- 파일 업로드: `/root/setlone-api/uploads/profiles/`
- URL 접근: `http://localhost:3000/uploads/profiles/filename.jpg`
- Base64: DB의 `profile_image` 필드에 직접 저장

## 권장 사항

**개발/소규모 프로젝트**: Base64 방식 사용 가능
- 간단하고 빠르게 구현 가능
- 외부 의존성 없음

**프로덕션/대규모 프로젝트**: 파일 시스템 또는 클라우드 스토리지
- 성능과 확장성 고려
- AWS S3, Cloudinary 등 권장

## 현재 프로젝트 설정

- **프로필 이미지**: Base64 지원 (TEXT 타입)
- **파일 업로드**: `/uploads/profiles/` 디렉토리에 저장
- **정적 파일 서빙**: `/uploads/` 경로로 접근 가능

