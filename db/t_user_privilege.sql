/*
  Keeps track of which privileges various users have
*/

create table if not exists user_privilege (
  user_id int not null,
  privilege_code int not null,
  
  primary key (user_id, privilege_code),
  constraint fk_user_privilege__user_id
    foreign key (user_id)
    references users (user_id),
  constraint fk_user_privilege__privilege_code
    foreign key (privilege_code)
    references privilege (privilege_code)

) engine=innodb  default charset=utf8 auto_increment=1 ;
