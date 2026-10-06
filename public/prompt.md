요청 : supabase의 testyh_2의 테이블을 둘로 나눌 거야
 - 하나는 board, 하나는 post
 - 게시판 목록은 board에, 게시글 목록은 post에 보관해줘.
 - post 테이블에 board_id 칼럼을 추가해줘
 - board 칼럼은 선택적 칼럼으로 설정해줘
 - board 칼럼이 board 테이블의 id를 참조하도록, 외래키로 설정해줘
 - board 테이블 데이터 삭제 시(게시판 삭제) 연결된 post 테이블의 board_id를 비워줘