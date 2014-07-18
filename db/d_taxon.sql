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
  (2, 'Quercus', 'alba','White oak'),
  (3, 'Platanus', 'x acerifolia','London planetree'),
  (4, 'Tilia', 'cordata','Littleleaf linden'),
  (5, 'Acer', 'platanoides','Norway maple'),
  (6, 'Fraxinus', 'pennsylvanica','Green ash'),
  (7, 'Pyrus', 'calleryana','Callery pear'),
  (8, 'Gleditsia', 'triacanthos','Honeylocust'),
  (9, 'Acer', 'saccharinum','Silver maple'),
  (10, 'Quercus', 'palustris','Pin oak'),
  (11, 'Ginkgo', 'biloba','Ginkgo'),
  (12, 'Ulmus', 'procera','English elm')
;