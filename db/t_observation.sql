/*Represents an observation, many of which can be associated with trees
I'd call this a 'comment' instead of an 'observation' if comment wasn't a 
reserved word in some databases (not in mysql)

user_id may be null if we allow annonymous users to comment
*/

create table if not exists observation (
  observation_id int not null auto_increment,
  tree_id int not null,
  comments varchar(200) default null,
  date_created datetime not null,
  user_id int not null,
  
  primary key (observation_id),
  
  constraint fk_observation__tree_id
    foreign key (tree_id)
    references tree (tree_id),
    
  constraint fk_observation__user_id
    foreign key (user_id)
    references users (user_id)
  
) engine=innodb  default charset=utf8 auto_increment=1 ;
