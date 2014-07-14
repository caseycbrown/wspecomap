/*Represents a tree*/

create table if not exists tree (
  tree_id int not null auto_increment,
  taxon_id int not null,
  dbh int default null,
  lat decimal(10,7) not null,
  lng decimal(10,7) not null,
  
  primary key (tree_id),
  
  constraint fk_tree__taxon_id
    foreign key (taxon_id)
    references taxon (taxon_id)
  
) engine=innodb  default charset=utf8 auto_increment=1 ;
