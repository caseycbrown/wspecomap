/*
  a layer is a set of objects that are visible at the same time.
  for instance, a squirrel nest layer contains all the trees with squirrel nests
*/

create table if not exists layer (
  layer_id int not null auto_increment,
  name varchar(40) not null,
  description varchar(255) not null,
  
  primary key (layer_id)
    
) engine=innodb  default charset=utf8 auto_increment=1 ;
