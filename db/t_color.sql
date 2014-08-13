/*Represents a color - used for displaying tree icons differently*/

create table if not exists color (
  color_id int not null auto_increment,
  hex_value varchar(6) default '54c32a',
  description varchar(100) default null,
  
  primary key (color_id)
    
) engine=innodb  default charset=utf8 auto_increment=1 ;
