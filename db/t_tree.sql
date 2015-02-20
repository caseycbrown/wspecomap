/*Represents a tree

  nyc_id is the number of the tree from the nyc park's tree inventory info.
  For the most part, it is just determined from the maps they gave me.  However,
  there are some trees, primarily in the northwest quadrant of the park, which
  made assigning an id a bit of an educated guess.  
  * there were 20 trees in the northwest quadrant of the map that had a nyc # that
    was used by a tree elsewhere in the park.  It seemed like the error was on the
    NW quadrant map; these trees have been given a null nyc_id
  * the NW quadrant had 92 hand-numbered trees (number 1 to 92) that were supposed
    to correspond to nyc_id 236 through 328.  this presented two problems:
    1) 20 trees elsewhere on the map were assigned a number between 236 and 328.
       These were mostly (all?) on the perimeter of the map, and after examining
       them it seemed likely that they were *not* the trees that matched the
       corresponding entries in the inventory spreadsheet.  Accordingly, these
       20 trees have a null nyc_id in this table
    2) Including both #s 236 and 328, there should be 93 hand-numbered trees, not 92.
       I looked carefully at how the inventory spreadsheet matched up to dbh
       indications on the NW quad map, and it appeared that somewhere between
       hand-numbered 26 and 31 a tree needed to be added in order to match the
       inventory spreadsheet.  It seemed reasonable that it may be the 4" sweetgum
       which was #266 in the spreadsheet, so I added that in a spot on the map
       that showed a sapling that hadn't been given a hand-numbered tree.

*/

create table if not exists tree (
  tree_id int not null auto_increment,  
  taxon_id int not null,
  dbh int default null,
  lat decimal(10,7) not null,
  lng decimal(10,7) not null,
  nyc_id int null,
  
  primary key (tree_id),
  
  constraint fk_tree__taxon_id
    foreign key (taxon_id)
    references taxon (taxon_id)
  
) engine=innodb  default charset=utf8 auto_increment=1 ;
