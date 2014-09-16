/*
Table name is plural because 'user' is a mysql reserved word

password is a hash encoding.  it contains salt, hash type, and iteration count
username must be unique
postal_code is open ended (instead of being, say 5-digit zip) 
  to accomodate users from other countries.  not sure how it'll be used...

*/

create table if not exists users (
  user_id int not null auto_increment,
  username varchar(25) not null,
  email varchar(255) not null,
  password varchar(100) not null,
  display_name varchar(25) null,
  first_name varchar(40) null,
  last_name varchar(40) null,
  postal_code varchar(32) null,
  is_verified bit(1) default 0,
  
  primary key (user_id),
  constraint uq_users__username
    unique key (username),
  constraint uq_users__email
    unique key (email)

) engine=innodb  default charset=utf8 auto_increment=1 ;
