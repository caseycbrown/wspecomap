/*Represents a taxonomic entry.  Rather doubtful that we would need to
have more than genus and species, but it could be done.  Could build out
the taxonomic structure in database tables, but at this point that seems
not even remotely useful for our purposes

usda_code is the abbreviation (typically 4 characters) that is used by usda at
plants.usda.gov (e.g. QUAL is Quercus alba)
  * Note: to complicate things a little, the data we have appears to have come
    from iTree, which uses codes that are very similar to USDA but not totally
    the same.  For example, USDA uses "ACER" for Acer species, wherease iTree
    uses the code "AC" for the same.  I have attempted to use the USDA code
    when they differ
*/

create table if not exists taxon (
  taxon_id int not null auto_increment,
  genus varchar(100) default null,
  species varchar(100) default null,
  common varchar(100) default null,
  usda_code varchar(100) default null,
  color_id int default null,
  
  primary key (taxon_id),
  
  constraint fk_taxon__color_id
    foreign key (color_id)
    references color (color_id)

    
) engine=innodb  default charset=utf8 auto_increment=1 ;
