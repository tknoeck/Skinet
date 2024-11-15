using API.RequestHelpers;
using Core.Entities;
using Core.Interfaces;
using Core.Specifications;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;


public class ProductsController(IUnitOfWork unit) : BaseApiController
{
    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Product>>> GetProducts([FromQuery]ProductSpecParams specParams)
    {
        var spec = new ProductSpecification(specParams);

        return Ok(await CreatePagedResult(unit.Repository<Product>(), spec, specParams.PageIndex, specParams.PageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Product>> GetProduct(int id){
        var product = await unit.Repository<Product>().GetByIdAsync(id);

        if (product == null) return NotFound();

        return product;
    }
    [HttpPost]
    public async Task<ActionResult<Product>> CreateProduct([FromBody]Product product){
        unit.Repository<Product>().Add(product);
        if(await unit.Complete()){
            return CreatedAtAction("GetProduct", new {id = product.Id}, product);
        }

        return BadRequest("Problem creating Product");
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> UpdateProduct(int id, Product product)
    {
        if(product.Id != id || !ProductExists(id)){
            return BadRequest("Cannot update this product");
        }

        unit.Repository<Product>().Update(product);

        if(await unit.Complete()){
            return NoContent();
        }
        return BadRequest("Problem updating the product");
        
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteProduct(int id)
    {
        var product = await unit.Repository<Product>().GetByIdAsync(id);

        if(product == null) return NotFound();

        unit.Repository<Product>().Remove(product);

         if(await unit.Complete()){
            return NoContent();
        }
        return BadRequest("Problem deleting the product");
    }
    [HttpGet("brands")]
    public async Task<ActionResult<IReadOnlyList<string>>> GetBrands()
    {
        var products = await unit.Repository<Product>().ListAllAsync();  
        var brands = products.Select(p => p.Brand).Distinct().ToList();  
        return Ok(brands);
    }

    [HttpGet("types")]
    public async Task<ActionResult<IReadOnlyList<string>>> GetTypes()
    {
        var products = await unit.Repository<Product>().ListAllAsync();  
        var types = products.Select(p => p.Type).Distinct().ToList();  
        return Ok(types);
    }

    private bool ProductExists(int id)
    {
        return unit.Repository<Product>().Exists(id);
    }
}
