/*populate taxon list - this is for initial setup when moving databases 
  (e.g. between development and production)
*/


insert into
  taxon (
    taxon_id,
    genus,
    species,
    common
  )
values
  (1, null, null, null),
  (2, 'Quercus', 'alba','white oak'),
  (3, 'Acer', 'rubrum','red maple')
;