/*Represents a taxonomic entry.  Rather doubtful that we would need to
have more than genus and species, but it could be done.  Could build out
the taxonomic structure in database tables, but at this point that seems
not even remotely useful for our purposes*/

create table if not exists taxon (
  taxon_id int not null auto_increment,
  genus varchar(100) default null,
  species varchar(100) default null,
  common varchar(100) default null,
  color_id int default null,
  
  primary key (taxon_id),
  
  constraint fk_taxon__color_id
    foreign key (color_id)
    references color (color_id)

    
) engine=innodb  default charset=utf8 auto_increment=1 ;
