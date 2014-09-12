/*
This table gets an entry for a user when that user requests password.  A token
is generated for the user which is stored here and sent as part of url

*/

create table if not exists pwtoken (  
  pwtoken_id int not null auto_increment,
  user_id int not null,
  token varchar(255) not null,
  expiration datetime not null,  
  
  primary key (pwtoken_id),
  constraint uq_pwtoken__user_id
    unique key (user_id)

) engine=innodb  default charset=utf8 auto_increment=1 ;
