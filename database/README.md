# Setlone Database

## 데이터베이스 스키마

### 테이블 구조

#### users
- 사용자 기본 정보
- 이메일, 사용자명, 비밀번호 해시
- 프로필 이미지, 소개
- 활성화 상태, 인증 상태

#### posts
- 게시물 정보 (인스타 피드 스타일)
- 사용자 ID, 내용, 이미지 URL
- 다중 이미지 지원 (JSON)
- 위치 정보
- 소프트 삭제 지원

#### likes
- 게시물 좋아요
- 사용자-게시물 조합 유니크 제약

#### comments
- 댓글 시스템
- 중첩 댓글 지원 (parent_comment_id)
- 소프트 삭제 지원

#### refresh_tokens
- JWT 리프레시 토큰 관리
- 토큰 만료 및 취소 관리

#### api_keys
- 외부 플랫폼 연동을 위한 API 키
- 해시된 키 저장
- 플랫폼별 키 관리
- 만료 시간 설정

#### follows
- 사용자 팔로우 시스템
- 팔로워-팔로잉 관계

## 설치 방법

### 방법 1: SQL 파일 직접 실행
```bash
mysql -u root -p < database/schema.sql
```

### 방법 2: MySQL 클라이언트에서 실행
```bash
mysql -u root -p
source /root/setlone-api/database/schema.sql;
```

### 방법 3: 스크립트 사용
```bash
./database/init.sh
```

## 데이터베이스 정보
- 데이터베이스명: `setlone_db`
- 문자셋: `utf8mb4`
- 콜레이션: `utf8mb4_unicode_ci`
- 엔진: `InnoDB`

## 인덱스
모든 주요 쿼리 패턴에 대해 인덱스가 최적화되어 있습니다:
- 사용자 조회: email, username
- 게시물 조회: user_id, created_at
- 좋아요/댓글: post_id, user_id

