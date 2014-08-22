/*
  a tree can belong to zero or more layers
*/

create table if not exists tree_layer (
  tree_id int not null,
  layer_id int not null,
  
  primary key (tree_id, layer_id),
  constraint fk_tree_layer__tree_id
    foreign key (tree_id)
    references tree (tree_id),
  constraint fk_tree_layer__layer_id
    foreign key (layer_id)
    references layer (layer_id)

) engine=innodb  default charset=utf8 auto_increment=1 ;
