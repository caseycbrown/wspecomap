/*
represents something that a user can do
*/

create table if not exists privilege (
  privilege_code int not null auto_increment,
  name varchar(40) not null,
  description varchar(255) not null,
  
  primary key (privilege_code)

) engine=innodb  default charset=utf8 auto_increment=1 ;
