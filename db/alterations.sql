/*a series of alterations that need to be made to existing database objects*/

/*For default, set trees to all be in the current layer*/

/*
  insert into tree_layer
  select tree_id, 1
  from tree
*/

/*
update tree, trees_1981
  set tree.taxon_id = trees_1981.taxon_id

  where
    tree.tree_id = trees_1981.tree_id
    and tree.taxon_id = 1 /*only change those that are currently unknown*/
/*
    
/*
  select
  *
  from
    trees_1981
  where
    tree_id not in (select tree_id from tree)
    */
    
    
  /*Here are the species that we have in the 1981 table
  
  
  select
species,
count(*) as c
from trees_1981
group by species

which returns

species 	c
? 	129
a 	31 (acacia)
c 	4  (catalpa)  
cat 	1
ch 	2 (cherry)
e 	20 (elm)
elm 	1
g 	19 (ginkco)
go 	3 (goldenrain tree)
h 	7 (hawthorn)
l 	5 (linden)
m 	13 (maple)
map 	1
o 	79 (oak)
oa 	4 (ornamental apple)
oak 	2
p 	2 (poplar)
s 	52 (sycamore)
w 	1 (???)

  
  */
  
update trees_1981
set taxon_id = 20
where species = 'c' or species = 'cat';
update trees_1981
set taxon_id = 59
where species = 'a';
update trees_1981
set taxon_id = 55
where species = 'ch';
update trees_1981
set taxon_id = 60
where species = 'e' or species = 'elm';
update trees_1981
set taxon_id = 11
where species = 'g';
update trees_1981
set taxon_id = 19
where species = 'go';
update trees_1981
set taxon_id = 22
where species = 'h';
update trees_1981
set taxon_id = 4
where species = 'l';
update trees_1981
set taxon_id = 57
where species = 'm' or species = 'map';
update trees_1981
set taxon_id = 56
where species = 'o' or species = 'oak';
update trees_1981
set taxon_id = 28
where species = 'oa';
update trees_1981
set taxon_id = 29
where species = 'p';
update trees_1981
set taxon_id = 58
where species = 's';
