/*populate taxon list - this is for initial setup when moving databases 
  (e.g. between development and production)
*/


/*
  I am trying to integrate a list of taxa, and it is a little tricky because
  some have been entered already in database and some have not.  And there is
  no correlation between the list I have (coming from Excel) and the list that
  is already in there as far as ids go.
  
  The first thing to do is to remove the taxa that are in the database but
  are not used for any tree - these are likely just random taxa that I added
  without knowing if there were any actual instances of them in the park
  

*/

delete from
  taxon
where
  taxon_id in (2,3,5,6,7,8,9,14)
;

/*Now there are a handful to update - those that have been entered in db 
differently than in excel file.  update to excel file (or, google docs i guess it is)*/
call update_taxon(13, 'Zelkova', 'serrata', 'Japanese zelkova');
call update_taxon(15, 'Metasequoia', 'glyptostroiboides', 'Dawn redwood');
call update_taxon(16, 'Platanus', 'x acerifolia', 'London planetree');
call update_taxon(17, 'Quercus', 'rubra', 'Northern red oak');
call update_taxon(18, 'Ulmus', 'americana', 'American elm');
call update_taxon(19, 'Koelreuteria', 'paniculata', 'Goldenrain tree');
call update_taxon(20, 'Catalpa', 'speciosa', 'Northern catalpa');


/*Now we have the list of those that aren't in the db and need to be added*/

insert into
  taxon (
    taxon_id,
    genus,
    species,
    common,
    color_id
  )
values
  
  (2, 'Cedrus', 'deodara', 'Deodar cedar', 2),
  (3, 'Cercidiphyllum', 'japonicum', 'Katsura tree', 1),
  
  (5, 'Cornus', 'florida', 'White dogwood', 1),
  (6, 'Ilex', 'opaca', 'American holly', 1),
  (7, 'Liquidambar', 'styraciflua', 'American sweetgum', 1),
  (8, 'Magnolia', 'soulangiana', 'Saucer magnolia', 1),
  (9, 'Cornus', 'kousa', 'Korean dogwood', 1),
  
  (14, 'Picea', 'omorika', 'Serbian spruce', 2),
  
  
  
  (21, 'Ginkgo', 'biloba', 'Ginkgo', 1),
  
  (22, 'Crataegus', 'spp.', 'Hawthorn', 1),
  (23, 'Tilia', 'americana', 'American linden', 1),
  (24, 'Acer', 'rubrum', 'Red maple', 1),
  (25, 'Quercus', 'phellos', 'Willow oak', 1),
  (26, 'Ulmus', 'procera', 'English elm', 1),
  (27, 'Quercus', 'palustris', 'Pin oak', 1),
  (28, 'Malus', 'spp.', 'Ornamental apple', 1),
  (29, 'Populus', 'spp.', 'Poplar', 1),
  (30, 'Platanus', 'occidentalis', 'American sycamore', 1),
  (31, 'Styrax', 'japonica', 'Japanese snowbell', 1),
  (32, 'Paulownia', 'tomentosa', 'Royal Paulownia?', 1),
  (33, 'Morus', 'rubra', 'Red mulberry', 1),
  (34, 'Aesculus', 'hippocastanum', 'Horsechestnut', 1),
  (35, 'Acer', 'pseudoplatanus', 'Sycamore maple', 1),
  (36, 'Fraxinus', 'pennsylvanica', 'Green ash', 1),
  (37, 'Styphnolobium', 'japonicum', 'Japanese pagodatree/Chinese scholar tree/previously Japanese Sophora', 1),
  (38, 'Syringa', 'reticulata', 'Japanese tree lilac', 1),
  (39, 'Pinus', 'strobus', 'Eastern white pine', 2),
  (40, 'Amelanchier', 'arborea', 'Downy serviceberry', 1),
  (41, 'Betula', 'papyrifera', 'Paper birch', 1),
  (42, 'Ulmus', 'pumila', 'Siberian elm', 1),
  (43, 'Fagus', 'grandifolia', 'American beech', 1),
  (44, 'Gymnocladus', 'dioicus', 'Kentucky coffeetree', 1),
  (45, 'Cercis', 'canadensis', 'Eastern redbud', 1),
  (46, 'Quercus', 'bicolor', 'Swamp white oak', 1),
  (47, 'Robinia', 'pseudoacacia', 'Black locust', 1),
  (48, 'Ulmus', 'rubra', 'Slippery elm', 1),
  (49, 'Taxodium', 'distichum', 'Bald cypress', 1),
  (50, 'Pyrus', 'calleryana', 'Callery pear', 1),
  (51, 'Ulmus', 'thomasii', 'Rock elm', 1),

  
  
  
  (52, 'Stewartia', 'pseudocamellia', 'Japanese stewartia', 1),
  (53, 'Tilia', 'cordata', 'Littleleaf linden', 1),
  
  (54, 'Gleditsia', 'triacanthos', 'Honeylocust', 1),
  
  (55, 'Prunus', 'serrulata', 'Kwanzan cherry', 1),
  
  
  (56, 'Quercus', 'spp.', 'Oak', 1),
  (57, 'Acer', 'spp.', 'Maple', 1),
  (58, 'Platanus', 'spp.', 'Sycamore', 1),
  (59, 'Acacia', 'spp.', 'Acacia', 1),
  (60, 'Ulmus', 'spp.', 'Elm', 1)

  
;



/*

Here is the master list of trees that we want to enter
  (2, 'Cedrus', 'deodara', 'Deodar cedar', 2),
  (3, 'Cercidiphyllum', 'japonicum', 'Katsura tree', 1),
  (4, 'Cornus', 'kousa', 'Korean dogwood', 1),
  (5, 'Cornus', 'florida', 'White dogwood', 1),
  (6, 'Ilex', 'opaca', 'American holly', 1),
  (7, 'Liquidambar', 'styraciflua', 'American sweetgum', 1),
  (8, 'Magnolia', 'soulangiana', 'Saucer magnolia', 1),
  (9, 'Metasequoia', 'glyptostroiboides', 'Dawn redwood', 2),
  (10, 'Picea', 'omorika', 'Serbian spruce', 2),
  (11, 'Quercus', 'rubra', 'Northern red oak', 1),
  (12, 'Quercus', 'phellos', 'Willow oak', 1),
  (13, 'Styrax', 'japonica', 'Japanese snowbell', 1),
  (14, 'Stewartia', 'pseudocamellia', 'Japanese stewartia', 1),
  (15, 'Tilia', 'cordata', 'Littleleaf linden', 1),
  (16, 'Zelkova', 'serrata', 'Japanese zelkova', 1),
  (17, 'Gleditsia', 'triacanthos', 'Honeylocust', 1),
  (18, 'Catalpa', 'speciosa', 'Northern catalpa', 1),
  (19, 'Prunus', 'serrulata', 'Kwanzan cherry', 1),
  (20, 'Ginkgo', 'biloba', 'Ginkgo', 1),
  (21, 'Koelreuteria', 'paniculata', 'Goldenrain tree', 1),
  (22, 'Crataegus', 'spp.', 'Hawthorn', 1),
  (23, 'Tilia', 'americana', 'American linden', 1),
  (24, 'Acer', 'rubrum', 'Red maple', 1),
  (25, 'Ulmus', 'americana', 'American elm', 1),
  (26, 'Ulmus', 'procera', 'English elm', 1),
  (27, 'Quercus', 'palustris', 'Pin oak', 1),
  (28, 'Malus', 'spp.', 'Ornamental apple', 1),
  (29, 'Populus', 'spp.', 'Poplar', 1),
  (30, 'Platanus', 'occidentalis', 'American sycamore', 1),
  (31, 'Platanus', 'x acerifolia', 'London planetree', 1),
  (32, 'Paulownia', 'tomentosa', 'Royal Paulownia?', 1),
  (33, 'Morus', 'rubra', 'Red mulberry', 1),
  (34, 'Aesculus', 'hippocastanum', 'Horsechestnut', 1),
  (35, 'Acer', 'pseudoplatanus', 'Sycamore maple', 1),
  (36, 'Fraxinus', 'pennsylvanica', 'Green ash', 1),
  (37, 'Styphnolobium', 'japonicum', 'Japanese pagodatree/Chinese scholar tree/previously Japanese Sophora', 1),
  (38, 'Syringa', 'reticulata', 'Japanese tree lilac', 1),
  (39, 'Pinus', 'strobus', 'Eastern white pine', 2),
  (40, 'Amelanchier', 'arborea', 'Downy serviceberry', 1),
  (41, 'Betula', 'papyrifera', 'Paper birch', 1),
  (42, 'Ulmus', 'pumila', 'Siberian elm', 1),
  (43, 'Fagus', 'grandifolia', 'American beech', 1),
  (44, 'Gymnocladus', 'dioicus', 'Kentucky coffeetree', 1),
  (45, 'Cercis', 'canadensis', 'Eastern redbud', 1),
  (46, 'Quercus', 'bicolor', 'Swamp white oak', 1),
  (47, 'Robinia', 'pseudoacacia', 'Black locust', 1),
  (48, 'Ulmus', 'rubra', 'Slippery elm', 1),
  (49, 'Taxodium', 'distichum', 'Bald cypress', 1),
  (50, 'Pyrus', 'calleryana', 'Callery pear', 1),
  (51, 'Ulmus', 'thomasii', 'Rock elm', 1)


*/