/*
Table name is plural because 'user' is a mysql reserved word

password is a hash encoding.  it contains salt, hash type, and iteration count

*/

create table if not exists users (
  user_id int not null auto_increment,
  email varchar(255) not null,
  display_name varchar(40) not null,
  password varchar(100) not null,
  
  primary key (user_id),
  constraint uq_users__email
    unique key (email)

) engine=innodb  default charset=utf8 auto_increment=1 ;
